# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.24.tar.gz"
  sha256 "83f2db369b558893591d988d3355a4ab9d39190da706bc16d70548d3ef7d8f13"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
