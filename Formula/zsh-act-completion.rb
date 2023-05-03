# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.8.tar.gz"
  sha256 "1897e31d7a516a159ec32a04bd7bef97250ca04503e6c24400c2d91e4913ce63"
  license "MIT"

  def install
    zsh_completion.install "_act"
  end
end
