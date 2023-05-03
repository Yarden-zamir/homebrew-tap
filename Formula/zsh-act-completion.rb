# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.22.tar.gz"
  sha256 "55be6cba8e9789a226c82c0c864c61ebd4cc7d980905071fb75645d6239a34a2"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
